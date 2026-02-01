package com.marketplace.ecommerce.webhook.service;

public interface WebhookService {

    boolean markDeliveredByGhnRef(String ghnOrderCode, String clientOrderCode);
}
