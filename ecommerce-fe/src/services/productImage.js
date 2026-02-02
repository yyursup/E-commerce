import axiosClient from '../api/axiosClient';

const PRODUCT_IMAGE_BASE = '/api/v1/product/image';

const productImageService = {
  // Upload single image
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axiosClient.post(
        `${PRODUCT_IMAGE_BASE}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Upload multiple images
  uploadMultipleImages: async (files) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
      
      const response = await axiosClient.post(
        `${PRODUCT_IMAGE_BASE}/upload-multiple`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Delete image
  deleteImage: async (imageUrl) => {
    try {
      await axiosClient.delete(PRODUCT_IMAGE_BASE, {
        params: { imageUrl },
      });
      return true;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default productImageService;
