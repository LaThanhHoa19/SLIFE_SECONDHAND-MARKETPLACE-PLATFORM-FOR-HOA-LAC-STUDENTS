import { Box, Divider } from '@mui/material';
import ListingSummary from './ListingSummary';
import ListingActions from './ListingActions';
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
  offerPrice,
  setOfferPrice,
  handleOffer
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        height: '100%',
        justifyContent: 'space-between' // Push Offer to bottom
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
        {!isOwnListing && (
          <ListingActions
            phoneNumber={phoneNumber}
            startingChat={startingChat}
            handleShowPhone={handleShowPhone}
            handleChat={handleChat}
          />
        )}

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />

        {/* Seller Info */}
        <ListingSellerInfo seller={seller} sellerId={sellerId} />
      </Box>

      {/* Offer Block - Pushed to bottom if there is space */}
      <Box>
        {!isOwnListing && !listing.isGiveaway && (
          <ListingOffer
            offerPrice={offerPrice}
            setOfferPrice={setOfferPrice}
            handleOffer={handleOffer}
          />
        )}
      </Box>
    </Box>
  );
}
