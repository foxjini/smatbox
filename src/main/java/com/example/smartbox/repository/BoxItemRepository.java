package com.example.smartbox.repository;

import com.example.smartbox.model.BoxItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BoxItemRepository extends JpaRepository<BoxItem, Long> {
    Optional<BoxItem> findByBoxNumber(int boxNumber);
}
