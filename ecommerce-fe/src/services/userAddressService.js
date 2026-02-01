import axiosClient from '../api/axiosClient';

const BASE_URL = '/api/v1/address';

export const userAddressService = {

    listMyAddresses: () => {
        return axiosClient.get(BASE_URL);
    },

    createMyAddress: (data) => {
        return axiosClient.post(BASE_URL, data);
    },

    updateMyAddress: (addressId, data) => {
        return axiosClient.put(`${BASE_URL}/${addressId}`, data);
    },

    deleteMyAddress: (addressId) => {
        return axiosClient.delete(`${BASE_URL}/${addressId}`);
    },

    setDefault: (addressId) => {
        return axiosClient.patch(`${BASE_URL}/${addressId}/default`);
    }
};
