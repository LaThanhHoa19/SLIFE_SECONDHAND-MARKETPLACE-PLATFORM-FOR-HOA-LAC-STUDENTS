import { Box, Divider } from '@mui/material';
import ListingSummary from './ListingSummary';
import ListingActions from './ListingActions';
import ListingOwnerActions from './ListingOwnerActions';
import ListingSellerInfo from './ListingSellerInfo';
import ListingOffer from './ListingOffer';

export default function ListingRightInfoBlock({
                                                  listing,
                                                  locationText,
                                                  phoneNumber,
                                                  startingChat,
                                                  handleShowPhone,
                                                  handleChat,
                                                  seller,
                                                  sellerId,
                                                  isOwnListing,
                                                  onNotify,
                                                  showSellerFollow,
                                                  sellerFollowed,
                                                  sellerFollowLoading,
                                                  onSellerFollowClick,
                                              }) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                // height: '100%', // Remove to prevent stretching
                // justifyContent: 'space-between' 
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                {/* Title, Price, Meta */}
                <ListingSummary
                    title={listing.title}
                    price={listing.price}
                    isGiveaway={listing.isGiveaway}
                    locationText={locationText}
                    createdAt={listing.createdAt}
                    itemCondition={listing.itemCondition}
                />

                {/* Action Buttons */}
                {!isOwnListing ? (
                    !(listing.status === 'SOLD' || listing.status === 'HIDDEN') && (
                        <ListingActions
                            phoneNumber={phoneNumber}
                            startingChat={startingChat}
                            handleShowPhone={handleShowPhone}
                            handleChat={handleChat}
                        />
                    )
                ) : (
                    <ListingOwnerActions 
                        listingId={listing.id}
                        onNotify={onNotify}
                        status={listing.status}
                    />
                )}

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />

                {/* Seller Info */}
                <ListingSellerInfo
                    seller={seller}
                    sellerId={sellerId}
                    showFollow={showSellerFollow}
                    isFollowed={sellerFollowed}
                    followLoading={sellerFollowLoading}
                    onFollowClick={onSellerFollowClick}
                />
            </Box>

            {/* Offer Block - Pushed to bottom if there is space */}
            <Box>
                {!isOwnListing && !listing.isGiveaway && !(listing.status === 'SOLD' || listing.status === 'HIDDEN') && (
                    <ListingOffer
                        listing={listing}
                        onNotify={onNotify}
                    />
                )}
            </Box>
        </Box>
    );
}
