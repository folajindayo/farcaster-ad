import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export class FileUploadService {
  private static uploadDir = path.join(process.cwd(), 'uploads');
  private static maxFileSize = 10 * 1024 * 1024; // 10MB
  private static allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  /**
   * Configure multer for file uploads
   */
  static getMulterConfig() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (this.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed`));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: 5 // Max 5 files per request
      }
    });
  }

  /**
   * Process uploaded image files
   */
  static async processImage(file: Express.Multer.File): Promise<UploadedFile> {
    try {
      const fileId = uuidv4();
      const filePath = file.path;
      const fileName = file.filename;

      // Get image metadata
      const metadata = await sharp(filePath).metadata();
      const dimensions = metadata.width && metadata.height ? {
        width: metadata.width,
        height: metadata.height
      } : undefined;

      // Create optimized versions for different use cases
      await this.createOptimizedVersions(filePath, fileName);

      const uploadedFile: UploadedFile = {
        id: fileId,
        originalName: file.originalname,
        filename: fileName,
        path: filePath,
        url: `/uploads/${fileName}`,
        size: file.size,
        mimeType: file.mimetype,
        dimensions
      };

      return uploadedFile;

    } catch (error) {
      console.error('Image processing failed:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Create optimized versions of images
   */
  private static async createOptimizedVersions(filePath: string, fileName: string): Promise<void> {
    const baseName = path.parse(fileName).name;
    const ext = path.parse(fileName).ext;

    try {
      // Create thumbnail (150x150)
      await sharp(filePath)
        .resize(150, 150, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(path.join(this.uploadDir, `${baseName}_thumb${ext}`));

      // Create medium size (800x600)
      await sharp(filePath)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(path.join(this.uploadDir, `${baseName}_medium${ext}`));

      // Create banner size (1200x400)
      await sharp(filePath)
        .resize(1200, 400, { fit: 'cover' })
        .jpeg({ quality: 90 })
        .toFile(path.join(this.uploadDir, `${baseName}_banner${ext}`));

    } catch (error) {
      console.error('Failed to create optimized versions:', error);
      // Don't throw error, original file is still valid
    }
  }

  /**
   * Validate creative assets for campaigns
   */
  static async validateCreativeAssets(files: Express.Multer.File[], campaignType: string): Promise<{
    isValid: boolean;
    errors: string[];
    assets: UploadedFile[];
  }> {
    const errors: string[] = [];
    const assets: UploadedFile[] = [];

    try {
      // Process each file
      for (const file of files) {
        const processedFile = await this.processImage(file);
        assets.push(processedFile);

        // Validate based on campaign type
        if (campaignType === 'banner') {
          if (!this.validateBannerAsset(processedFile)) {
            errors.push(`Invalid banner asset: ${file.originalname}`);
          }
        } else if (campaignType === 'pinned_cast') {
          if (!this.validatePinnedCastAsset(processedFile)) {
            errors.push(`Invalid pinned cast asset: ${file.originalname}`);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        assets
      };

    } catch (error) {
      return {
        isValid: false,
        errors: ['Failed to process creative assets'],
        assets: []
      };
    }
  }

  /**
   * Validate banner assets
   */
  private static validateBannerAsset(asset: UploadedFile): boolean {
    if (!asset.dimensions) return false;

    const { width, height } = asset.dimensions;
    const aspectRatio = width / height;

    // Banner should be wide (aspect ratio > 1.5)
    return aspectRatio >= 1.5 && width >= 800 && height >= 400;
  }

  /**
   * Validate pinned cast assets
   */
  private static validatePinnedCastAsset(asset: UploadedFile): boolean {
    if (!asset.dimensions) return false;

    const { width, height } = asset.dimensions;
    const aspectRatio = width / height;

    // Pinned cast should be square or portrait
    return aspectRatio <= 1.2 && width >= 400 && height >= 400;
  }

  /**
   * Delete uploaded files
   */
  static async deleteFiles(fileIds: string[]): Promise<void> {
    try {
      for (const fileId of fileIds) {
        // Find files by ID (you might want to store file mappings in database)
        const files = fs.readdirSync(this.uploadDir);
        const matchingFiles = files.filter(file => file.includes(fileId));

        for (const file of matchingFiles) {
          const filePath = path.join(this.uploadDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete files:', error);
    }
  }

  /**
   * Get file URL
   */
  static getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  /**
   * Get optimized file URL
   */
  static getOptimizedFileUrl(filename: string, size: 'thumb' | 'medium' | 'banner' = 'medium'): string {
    const baseName = path.parse(filename).name;
    const ext = path.parse(filename).ext;
    return `/uploads/${baseName}_${size}${ext}`;
  }

  /**
   * Serve static files
   */
  static setupStaticFileServing(app: any): void {
    app.use('/uploads', (req: any, res: any, next: any) => {
      // Add CORS headers for file serving
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    app.use('/uploads', (req: any, res: any, next: any) => {
      const filePath = path.join(this.uploadDir, req.path);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Set appropriate headers
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      next();
    });
  }
}


