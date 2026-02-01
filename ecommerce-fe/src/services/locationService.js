import axiosClient from '../api/axiosClient';

// Assuming backend proxies these or provides them at /api/location
// The interface matches GHN (Giao Hang Nhanh) data structure (ProvinceID, ProvinceName, etc.)
const BASE_URL = '/location';

export const locationService = {
    getProvinces: async () => {
        // Expected response: { data: Province[] } where Province = { ProvinceID, ProvinceName }
        return axiosClient.get(`${BASE_URL}/provinces`);
    },

    getDistricts: async (provinceId) => {
        // Expected response: { data: District[] } where District = { DistrictID, DistrictName, ProvinceID }
        return axiosClient.get(`${BASE_URL}/districts`, {
            params: { provinceId }
        });
    },

    getWards: async (districtId) => {
        // Expected response: { data: Ward[] } where Ward = { WardCode, WardName, DistrictID }
        return axiosClient.get(`${BASE_URL}/wards`, {
            params: { districtId }
        });
    }
};
