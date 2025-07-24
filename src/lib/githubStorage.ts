/**
 * GitHub Storage Utility
 * Handles uploading and managing images via GitHub API
 */

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

interface GitHubUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

class GitHubStorage {
  private config: GitHubConfig;
  private baseApiUrl: string;

  constructor() {
    this.config = {
      token: process.env.GITHUB_TOKEN || '',
      owner: process.env.GITHUB_OWNER || '',
      repo: process.env.GITHUB_REPO || '',
      branch: process.env.GITHUB_BRANCH || 'main',
    };

    this.baseApiUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents`;

    // Validate configuration
    if (!this.config.token || !this.config.owner || !this.config.repo) {
      throw new Error('GitHub storage configuration is incomplete. Please check environment variables.');
    }
  }

  /**
   * Upload a file to GitHub repository
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    path: string = 'uploads/products'
  ): Promise<GitHubUploadResponse> {
    try {
      const filePath = `${path}/${fileName}`;
      const base64Content = file.toString('base64');

      // Check if file already exists to get SHA (required for updates)
      let sha: string | undefined;
      try {
        const existingFile = await this.getFile(filePath);
        sha = existingFile.sha;
      } catch (error) {
        // File doesn't exist, which is fine for new uploads
      }

      const requestBody = {
        message: `Upload image: ${fileName}`,
        content: base64Content,
        branch: this.config.branch,
        ...(sha && { sha }), // Include SHA if file exists (for updates)
      };

      const response = await fetch(`${this.baseApiUrl}/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Generate the raw URL for the uploaded file
      const rawUrl = this.getRawUrl(filePath);

      return {
        success: true,
        url: rawUrl,
      };
    } catch (error) {
      console.error('GitHub upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get file information from GitHub
   */
  private async getFile(filePath: string) {
    const response = await fetch(`${this.baseApiUrl}/${filePath}`, {
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`File not found: ${filePath}`);
    }

    return await response.json();
  }

  /**
   * Generate raw URL for a file in the repository
   */
  private getRawUrl(filePath: string): string {
    return `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${this.config.branch}/${filePath}`;
  }

  /**
   * Delete a file from GitHub repository
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      // Get file SHA first
      const fileInfo = await this.getFile(filePath);
      
      const requestBody = {
        message: `Delete image: ${filePath}`,
        sha: fileInfo.sha,
        branch: this.config.branch,
      };

      const response = await fetch(`${this.baseApiUrl}/${filePath}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      return response.ok;
    } catch (error) {
      console.error('GitHub delete error:', error);
      return false;
    }
  }

  /**
   * Generate a unique filename for uploads
   */
  generateFileName(originalName: string, productId: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop() || 'jpg';
    return `${productId}_${timestamp}.${extension}`;
  }

  /**
   * Extract file path from GitHub raw URL
   */
  extractFilePathFromUrl(url: string): string | null {
    const rawUrlPattern = new RegExp(
      `https://raw\\.githubusercontent\\.com/${this.config.owner}/${this.config.repo}/${this.config.branch}/(.+)`
    );
    const match = url.match(rawUrlPattern);
    return match ? match[1] : null;
  }
}

// Export singleton instance
export const githubStorage = new GitHubStorage();

// Export types
export type { GitHubUploadResponse };
