package com.marketplace.ecommerce.chatbot.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminLiveChatController {

    @GetMapping("/live-chat")
    public String liveChat(Model model) {
        model.addAttribute("pageTitle", "Live Chat");
        return "admin/live-chat";
    }
}
