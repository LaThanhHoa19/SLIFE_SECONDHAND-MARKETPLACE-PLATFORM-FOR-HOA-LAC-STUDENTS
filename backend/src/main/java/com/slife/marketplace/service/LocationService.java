package com.slife.marketplace.service;

import com.slife.marketplace.repository.ListingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LocationService {

    private final ListingRepository listingRepository;

    public LocationService(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    public List<String> getPickupLocations() {
        return listingRepository.findDistinctPickupLocationNames();
    }
}
