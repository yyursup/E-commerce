import axiosClient from '../api/axiosClient';

const BASE_URL = '/api/v1/shipping';

export const locationService = {
    getProvinces: async () => {
        return axiosClient.get(`${BASE_URL}/provinces`);
    },

    getDistricts: async (provinceId) => {
        return axiosClient.get(`${BASE_URL}/districts`, {
            params: { provinceId }
        });
    },

    getWards: async (districtId) => {
        return axiosClient.get(`${BASE_URL}/wards`, {
            params: { districtId }
        });
    }
};
