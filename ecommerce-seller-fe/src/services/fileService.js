import api from '../lib/axios';

const fileService = {
  /**
   * Upload single file to MinIO storage
   * @param {File} file - File object to upload
   * @param {string} folder - Destination folder (default: 'licenses')
   * @returns {Promise<{ fileName: string, url: string, size: number, contentType: string }>}
   */
  uploadFile: async (file, folder = 'licenses') => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/files/upload', formData, {
        params: { folder },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default fileService;
