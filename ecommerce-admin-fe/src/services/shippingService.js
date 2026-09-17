import axiosClient from '../api/axiosClient';

const SHIPPING_BASE = '/api/v1/shipping';

export const shippingService = {
    // Get provinces
    getProvinces: async () => {
        try {
            const response = await axiosClient.get(`${SHIPPING_BASE}/provinces`);
            return response.data;
        } catch (error) {
            console.error("Error fetching provinces", error);
            return [];
        }
    },

    // Get districts
    getDistricts: async (provinceId) => {
        try {
            const response = await axiosClient.get(`${SHIPPING_BASE}/districts`, {
                params: { provinceId }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching districts", error);
            return [];
        }
    },

    // Get wards
    getWards: async (districtId) => {
        try {
            const response = await axiosClient.get(`${SHIPPING_BASE}/wards`, {
                params: { districtId }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching wards", error);
            return [];
        }
    },

    // Calculate fee
    calculateFee: async (data) => {
        try {
            // data should include:
            // from_district_id, from_ward_code (sender)
            // to_district_id, to_ward_code (receiver)
            // weight, height, length, width (package info)
            // service_type_id (usually 2 for standard)
            const response = await axiosClient.post(`${SHIPPING_BASE}/fee`, data);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    }
};
