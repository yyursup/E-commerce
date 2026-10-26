package com.marketplace.ecommerce.shipping.usecase.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.ecommerce.config.GHNConfig;
import com.marketplace.ecommerce.shipping.dto.request.GHNCalculateFeeRequest;
import com.marketplace.ecommerce.shipping.dto.response.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GHNClientImplTest {

    @Mock
    private RestClient ghnRestClient;
    @Mock
    private GHNConfig cfg;

    private ObjectMapper objectMapper;
    private GHNClientImpl client;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        client = new GHNClientImpl(ghnRestClient, cfg, objectMapper);
    }

    @Test
    @DisplayName("calculateFee ném ngoại lệ khi chưa cấu hình token hoặc shopId")
    void testCalculateFee_Unconfigured() {
        when(cfg.getToken()).thenReturn(null);
        assertThrows(RuntimeException.class, () -> client.calculateFee(new GHNCalculateFeeRequest()));

        when(cfg.getToken()).thenReturn("token-123");
        when(cfg.getShopId()).thenReturn(null);
        assertThrows(RuntimeException.class, () -> client.calculateFee(new GHNCalculateFeeRequest()));
    }

    @Test
    @DisplayName("calculateFee gọi RestClient thành công khi cấu hình đầy đủ")
    void testCalculateFee_Success() {
        when(cfg.getToken()).thenReturn("token-123");
        when(cfg.getShopId()).thenReturn("1442");

        RestClient.RequestBodyUriSpec uriSpec = mock(RestClient.RequestBodyUriSpec.class);
        RestClient.RequestBodySpec bodySpec = mock(RestClient.RequestBodySpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(ghnRestClient.post()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(bodySpec);
        when(bodySpec.header(anyString(), anyString())).thenReturn(bodySpec);
        when(bodySpec.body(any(Object.class))).thenReturn(bodySpec);
        when(bodySpec.retrieve()).thenReturn(responseSpec);

        GHNCalculateFeeResponse feeData = new GHNCalculateFeeResponse();
        feeData.setTotal(35000);

        GHNCommonResponse<GHNCalculateFeeResponse> commonRes = new GHNCommonResponse<>();
        commonRes.setCode(200);
        commonRes.setData(feeData);

        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(commonRes);

        GHNCalculateFeeResponse res = client.calculateFee(new GHNCalculateFeeRequest());
        assertNotNull(res);
        assertEquals(35000, res.getTotal());
    }

    @Test
    @DisplayName("getProvinces gọi GET API lấy danh sách tỉnh thành")
    void testGetProvinces() {
        when(cfg.getToken()).thenReturn("token-123");

        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(ghnRestClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(uriSpec);
        when(uriSpec.retrieve()).thenReturn(responseSpec);

        GHNProvinceResponse p = new GHNProvinceResponse();
        p.setProvinceID(201);
        p.setProvinceName("TP. Hồ Chí Minh");

        GHNCommonResponse<List<GHNProvinceResponse>> commonRes = new GHNCommonResponse<>();
        commonRes.setCode(200);
        commonRes.setData(List.of(p));

        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(commonRes);

        List<GHNProvinceResponse> provinces = client.getProvinces();
        assertNotNull(provinces);
        assertEquals(1, provinces.size());
        assertEquals("TP. Hồ Chí Minh", provinces.get(0).getProvinceName());
    }

    @Test
    @DisplayName("unwrap ném ngoại lệ khi GHN trả về mã lỗi khác 200")
    void testUnwrap_Error() {
        when(cfg.getToken()).thenReturn("token-123");

        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(ghnRestClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(uriSpec);
        when(uriSpec.retrieve()).thenReturn(responseSpec);

        GHNCommonResponse<List<GHNProvinceResponse>> commonRes = new GHNCommonResponse<>();
        commonRes.setCode(400);
        commonRes.setMessage("Token hết hạn");

        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(commonRes);

        RuntimeException ex = assertThrows(RuntimeException.class, client::getProvinces);
        assertTrue(ex.getMessage().contains("Token hết hạn"));
    }

    @Test
    @DisplayName("createOrder gọi POST API tạo đơn hàng vận chuyển thành công")
    void testCreateOrder() {
        when(cfg.getToken()).thenReturn("token-123");
        when(cfg.getShopId()).thenReturn("1442");

        RestClient.RequestBodyUriSpec uriSpec = mock(RestClient.RequestBodyUriSpec.class);
        RestClient.RequestBodySpec bodySpec = mock(RestClient.RequestBodySpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(ghnRestClient.post()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(bodySpec);
        when(bodySpec.header(anyString(), anyString())).thenReturn(bodySpec);
        when(bodySpec.body(any(Object.class))).thenReturn(bodySpec);
        when(bodySpec.retrieve()).thenReturn(responseSpec);

        GHNCreateOrderResponse createData = new GHNCreateOrderResponse();
        createData.setOrderCode("GHN123456");

        GHNCommonResponse<GHNCreateOrderResponse> commonRes = new GHNCommonResponse<>();
        commonRes.setCode(200);
        commonRes.setData(createData);

        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(commonRes);

        com.marketplace.ecommerce.shipping.dto.request.GHNCreateOrderRequest req =
                new com.marketplace.ecommerce.shipping.dto.request.GHNCreateOrderRequest();
        GHNCreateOrderResponse res = client.createOrder(req);
        assertNotNull(res);
        assertEquals("GHN123456", res.getOrderCode());
    }

    @Test
    @DisplayName("getOrderDetailByClientCode gọi API tra cứu chi tiết vận đơn theo mã đơn")
    void testGetOrderDetailByClientCode() {
        when(cfg.getToken()).thenReturn("token-123");
        when(cfg.getShopId()).thenReturn("1442");

        RestClient.RequestBodyUriSpec uriSpec = mock(RestClient.RequestBodyUriSpec.class);
        RestClient.RequestBodySpec bodySpec = mock(RestClient.RequestBodySpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(ghnRestClient.post()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(bodySpec);
        when(bodySpec.header(anyString(), anyString())).thenReturn(bodySpec);
        when(bodySpec.body(any(Object.class))).thenReturn(bodySpec);
        when(bodySpec.retrieve()).thenReturn(responseSpec);

        GHNOrderDetailResponse detailData = new GHNOrderDetailResponse();
        detailData.setOrder_code("GHN123456");
        detailData.setStatus("delivering");

        GHNCommonResponse<GHNOrderDetailResponse> commonRes = new GHNCommonResponse<>();
        commonRes.setCode(200);
        commonRes.setData(detailData);

        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(commonRes);

        GHNOrderDetailResponse res = client.getOrderDetailByClientCode("ORD-CLIENT-001");
        assertNotNull(res);
        assertEquals("delivering", res.getStatus());
    }

    @Test
    @DisplayName("cancelOrder gọi API hủy đơn giao vận GHN")
    void testCancelOrder() {
        when(cfg.getToken()).thenReturn("token-123");
        when(cfg.getShopId()).thenReturn("1442");

        RestClient.RequestBodyUriSpec uriSpec = mock(RestClient.RequestBodyUriSpec.class);
        RestClient.RequestBodySpec bodySpec = mock(RestClient.RequestBodySpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(ghnRestClient.post()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(bodySpec);
        when(bodySpec.header(anyString(), anyString())).thenReturn(bodySpec);
        when(bodySpec.body(any(Object.class))).thenReturn(bodySpec);
        when(bodySpec.retrieve()).thenReturn(responseSpec);

        GHNCancelOrderResponse cancelData = new GHNCancelOrderResponse();
        cancelData.setOrder_codes(List.of("GHN123456"));
        cancelData.setResult(true);

        GHNCommonResponse<GHNCancelOrderResponse> commonRes = new GHNCommonResponse<>();
        commonRes.setCode(200);
        commonRes.setData(cancelData);

        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(commonRes);

        GHNCancelOrderResponse res = client.cancelOrder("GHN123456");
        assertNotNull(res);
        assertTrue(res.getResult());
    }

    @Test
    @DisplayName("getDistricts và getWards gọi API lấy danh mục địa lý quận huyện và phường xã")
    void testGetDistrictsAndWards() {
        when(cfg.getToken()).thenReturn("token-123");

        RestClient.RequestBodyUriSpec uriSpec = mock(RestClient.RequestBodyUriSpec.class);
        RestClient.RequestBodySpec bodySpec = mock(RestClient.RequestBodySpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(ghnRestClient.post()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(bodySpec);
        when(bodySpec.body(any(Object.class))).thenReturn(bodySpec);
        when(bodySpec.retrieve()).thenReturn(responseSpec);

        // Districts
        GHNDistrictResponse d = new GHNDistrictResponse();
        d.setDistrictID(1442);
        d.setDistrictName("Quận 1");

        GHNCommonResponse<List<GHNDistrictResponse>> districtCommon = new GHNCommonResponse<>();
        districtCommon.setCode(200);
        districtCommon.setData(List.of(d));

        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(districtCommon);

        List<GHNDistrictResponse> districts = client.getDistricts(201);
        assertNotNull(districts);
        assertEquals(1, districts.size());
        assertEquals("Quận 1", districts.get(0).getDistrictName());

        // Wards
        GHNWardResponse w = new GHNWardResponse();
        w.setWardCode("20101");
        w.setWardName("Phường Bến Nghé");

        GHNCommonResponse<List<GHNWardResponse>> wardCommon = new GHNCommonResponse<>();
        wardCommon.setCode(200);
        wardCommon.setData(List.of(w));

        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(wardCommon);

        List<GHNWardResponse> wards = client.getWards(1442);
        assertNotNull(wards);
        assertEquals(1, wards.size());
        assertEquals("Phường Bến Nghé", wards.get(0).getWardName());
    }

    @Test
    @DisplayName("unwrap ném ngoại lệ khi phản hồi trả về null")
    void testUnwrap_NullResponse() {
        when(cfg.getToken()).thenReturn("token-123");

        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(ghnRestClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(uriSpec);
        when(uriSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(null);

        RuntimeException ex = assertThrows(RuntimeException.class, client::getProvinces);
        assertTrue(ex.getMessage().contains("returned null"));
    }

}
