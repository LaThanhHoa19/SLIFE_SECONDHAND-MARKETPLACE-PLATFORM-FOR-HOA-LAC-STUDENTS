import { Box, ImageList, ImageListItem } from '@mui/material';

export default function ImageGrid({ images = [], title = '' }) {
    if (!Array.isArray(images) || images.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mt: 2 }}>
            <ImageList cols={2} gap={8} sx={{ m: 0 }}>
                {images.map((image, index) => (
                    <ImageListItem key={`${image}-${index}`}>
                        <Box
                            component="img"
                            src={image}
                            alt={`${title} - image ${index + 1}`}
                            loading="lazy"
                            sx={{
                                display: 'block',
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 1,
                            }}
                        />
                    </ImageListItem>
                ))}
            </ImageList>
        </Box>
    );
}