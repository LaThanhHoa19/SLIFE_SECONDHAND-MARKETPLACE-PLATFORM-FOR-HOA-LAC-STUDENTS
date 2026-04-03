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
                                                  startingChat = false,
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
    const normalizedStatus = String(listing?.status || listing?.itemStatus || '').toUpperCase();
    const isUnavailable = normalizedStatus === 'SOLD' || normalizedStatus === 'HIDDEN' || normalizedStatus === 'MOD_HIDDEN';

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5, // Thu hẹp thêm 0.5 để khít hơn
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
                    !isUnavailable && (
                         <Box sx={{ my: 1.6 }}>
                            <ListingActions
                                phoneNumber={phoneNumber}
                                startingChat={startingChat}
                                handleShowPhone={handleShowPhone}
                                handleChat={handleChat}
                            />
                         </Box>
                    )
                ) : (
                    <ListingOwnerActions
                        listingId={listing.id}
                        onNotify={onNotify}
                        status={listing.status}
                    />
                )}



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
            <Box sx={{ mt: 0.25 }}>
                {!isOwnListing && !listing.isGiveaway && !isUnavailable && (
                    <ListingOffer
                        listing={listing}
                        onNotify={onNotify}
                    />
                )}
            </Box>
        </Box>
    );
}
