import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/campaigns`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate a valid MongoDB ObjectId for advertiserId if it's not provided or invalid
    if (
      !body.advertiserId ||
      body.advertiserId === 'default-user' ||
      body.advertiserId === 'test-user'
    ) {
      // Generate a valid 24-character hex ObjectId
      const timestamp = Math.floor(Date.now() / 1000)
        .toString(16)
        .padStart(8, '0');
      const random1 = Math.floor(Math.random() * 0xffff)
        .toString(16)
        .padStart(4, '0');
      const random2 = Math.floor(Math.random() * 0xffff)
        .toString(16)
        .padStart(4, '0');
      const random3 = Math.floor(Math.random() * 0xffff)
        .toString(16)
        .padStart(4, '0');
      const random4 = Math.floor(Math.random() * 0xffff)
        .toString(16)
        .padStart(4, '0');
      body.advertiserId = timestamp + random1 + random2 + random3 + random4;
    }
    
    const response = await fetch(`${BACKEND_URL}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Backend responded with ${response.status}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create campaign',
      },
      { status: 500 }
    );
  }
}
