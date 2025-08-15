package com.example.smartbox.service;

import com.example.smartbox.model.BoxItem;
import com.example.smartbox.repository.BoxItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoxItemService {
    private final BoxItemRepository repository;

    public List<BoxItem> getAll() {
        return repository.findAll();
    }

    public BoxItem update(int boxNumber, BoxItem updatedItem) {
        BoxItem item = repository.findByBoxNumber(boxNumber)
                .orElse(BoxItem.builder().boxNumber(boxNumber).build());

        item.setItemName(updatedItem.getItemName());
        item.setStored(updatedItem.isStored());
        item.setReservedTime(updatedItem.getReservedTime());
        item.setAlarmOn(updatedItem.isAlarmOn());
        item.setPhotoUrl(updatedItem.getPhotoUrl());

        return repository.save(item);
    }

    public BoxItem clearAlarm(int boxNumber) {
        return repository.findByBoxNumber(boxNumber).map(item -> {
            item.setAlarmOn(false);
            return repository.save(item);
        }).orElseThrow();
    }
}