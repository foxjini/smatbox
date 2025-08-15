package com.example.smartbox.controller;

import com.example.smartbox.model.BoxItem;
import com.example.smartbox.service.BoxItemService;
import com.example.smartbox.service.AlarmPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boxes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class BoxItemController {
    private final BoxItemService service;
    private final AlarmPushService alarmPushService;

    @GetMapping
    public List<BoxItem> getAll() {
        return service.getAll();
    }

    @PostMapping("/{boxNumber}")
    public BoxItem update(@PathVariable int boxNumber, @RequestBody BoxItem item) {
        BoxItem updated = service.update(boxNumber, item);

        // 알람이 켜진 상태가 아닌 경우에만 일반 LED 제어
        if (!updated.isAlarmOn()) {
            alarmPushService.updateBoxStatus(updated);
        }

        return updated;
    }

    @PostMapping("/{boxNumber}/clear-alarm")
    public void clearAlarm(@PathVariable int boxNumber) {
        BoxItem item = service.clearAlarm(boxNumber);
        alarmPushService.clearAlarm(item);
    }
}