import axiosClient from '../api/axiosClient';

const BASE_URL = '/api/v1/address';

export const userAddressService = {

    listMyAddresses: async () => {
        try {
            const response = await axiosClient.get(BASE_URL);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    createMyAddress: async (data) => {
        try {
            const response = await axiosClient.post(BASE_URL, data);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    updateMyAddress: async (addressId, data) => {
        try {
            const response = await axiosClient.put(`${BASE_URL}/${addressId}`, data);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    deleteMyAddress: async (addressId) => {
        try {
            const response = await axiosClient.delete(`${BASE_URL}/${addressId}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    setDefault: async (addressId) => {
        try {
            const response = await axiosClient.patch(`${BASE_URL}/${addressId}/default`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    }
};
