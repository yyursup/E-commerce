package com.marketplace.ecommerce.chatbot.dto.response;

import com.marketplace.ecommerce.chat.dto.ChatbotProductCardResponse;

import java.util.List;

/**
 * @param choices    nút trả lời nhanh do AI đưa ra (bấm = gửi đúng text đó)
 * @param paymentUrl link VNPay khi AI vừa tạo đơn thanh toán VNPay
 * @param memo       dữ liệu id cho lượt sau (client gửi kèm lại trong lịch sử, khách không thấy)
 */
public record AiChatResponse(String reply, List<ChatbotProductCardResponse> productCards,
                             List<String> choices, String paymentUrl, String memo) {
}
