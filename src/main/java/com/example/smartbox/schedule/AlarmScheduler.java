package com.example.smartbox.schedule;

import com.example.smartbox.model.BoxItem;
import com.example.smartbox.service.AlarmPushService;
import com.example.smartbox.service.BoxItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AlarmScheduler {
    private final BoxItemService boxItemService;
    private final AlarmPushService alarmPushService;

    @Scheduled(fixedRate = 60000)
    public void checkAlarms() {
        System.out.println("🔍 AlarmScheduler 실행됨: " + LocalDateTime.now());

        for (BoxItem item : boxItemService.getAll()) {
            System.out.println("  ▶ 검사 중: box " + item.getBoxNumber() + ", reserved=" + item.getReservedTime() + ", stored=" + item.isStored() + ", alarmOn=" + item.isAlarmOn());

            if (
                    item.getReservedTime() != null &&
                            item.isStored() &&
                            item.getReservedTime().isBefore(LocalDateTime.now()) &&
                            !item.isAlarmOn()
            ) {
                System.out.println("  🚨 알람 조건 충족 → 알람 설정 중!");
                item.setAlarmOn(true);
                boxItemService.update(item.getBoxNumber(), item);
                alarmPushService.pushAlarm(item);
            }
        }
    }
}
