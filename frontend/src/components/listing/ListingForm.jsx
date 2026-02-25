/**
 * Mục đích: Form reusable cho tạo/cập nhật listing.
 * API: POST /api/listings, PUT /api/listings/{id}, POST /api/listings/{id}/images.
 * Validation: react-hook-form; title 10-120 ký tự, description 20-2000, price >=0.
 */
import { Box, Button, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import ImageUploader from '../common/ImageUploader';

export default function ListingForm({ defaultValues = {}, onSubmit }) {
  const { register, handleSubmit } = useForm({ defaultValues });
  return (
    <Box component="form" onSubmit={handleSubmit((values) => onSubmit?.(values))}>
      <TextField label="Tiêu đề" {...register('title')} />
      <TextField label="Mô tả" multiline rows={4} {...register('description')} />
      <TextField label="Giá" type="number" {...register('price')} />
      <ImageUploader />
      <Button type="submit">TODO: Submit listing</Button>
    </Box>
  );
}
