import { NextRequest, NextResponse } from 'next/server';
import { githubStorage } from '@/lib/githubStorage';

export async function DELETE(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'No image URL provided' }, { status: 400 });
    }

    // Extract file path from GitHub raw URL
    const filePath = githubStorage.extractFilePathFromUrl(imageUrl);
    
    if (!filePath) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid GitHub image URL' 
      }, { status: 400 });
    }

    // Delete the file from GitHub
    const success = await githubStorage.deleteFile(filePath);

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Image deleted successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete image from GitHub' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete image' 
    }, { status: 500 });
  }
}
