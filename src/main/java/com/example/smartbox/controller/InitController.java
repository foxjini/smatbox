package com.example.smartbox.controller;

import com.example.smartbox.model.BoxItem;
import com.example.smartbox.repository.BoxItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/init")
public class InitController {

    private final BoxItemRepository repo;

    @PostMapping
    public String initializeBoxes() {
        for (int i = 0; i < 6; i++) {
            if (repo.findByBoxNumber(i).isEmpty()) {
                repo.save(BoxItem.builder()
                        .boxNumber(i)
                        .itemName(null)
                        .stored(false)
                        .reservedTime(null)
                        .alarmOn(false)
                        .build());
            }
        }
        return "6칸 초기화 완료";
    }
}