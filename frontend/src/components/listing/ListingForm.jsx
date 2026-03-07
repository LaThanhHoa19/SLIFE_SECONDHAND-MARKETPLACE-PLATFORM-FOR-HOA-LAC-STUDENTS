/**
 * Form tạo/cập nhật listing.
 * API: POST /api/listings, PUT /api/listings/{id}, POST /api/listings/{id}/images.
 */
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  Stack,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import ImageUploader from '../common/ImageUploader';
import { getCategories } from '../../api/categoryApi';

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'Mới' },
  { value: 'USED_LIKE_NEW', label: 'Đã dùng - như mới' },
  { value: 'USED_GOOD', label: 'Đã dùng - tốt' },
  { value: 'USED_FAIR', label: 'Đã dùng - ổn' },
];

const PURPOSE_OPTIONS = [
  { value: 'SALE', label: 'Bán' },
  { value: 'GIVEAWAY', label: 'Cho tặng' },
  { value: 'FLASH', label: 'Flash sale' },
];

export default function ListingForm({ defaultValues = {}, onSubmit, submitting = false, mode = 'create' }) {
  const [imageFiles, setImageFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      condition: 'USED_GOOD',
      purpose: 'SALE',
      isGiveaway: false,
      categoryId: '',
      ...defaultValues,
    },
  });
  const isGiveaway = watch('isGiveaway');

  useEffect(() => {
    getCategories()
      .then((res) => {
        const data = res?.data?.data ?? res?.data;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (isGiveaway) setValue('price', 0);
  }, [isGiveaway, setValue]);

  const onFormSubmit = (values) => {
    onSubmit?.(values, imageFiles);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} noValidate>
      <Stack spacing={2}>
        <TextField
          label="Tiêu đề"
          required
          fullWidth
          {...register('title', { required: 'Nhập tiêu đề', minLength: { value: 10, message: 'Tối thiểu 10 ký tự' }, maxLength: { value: 300, message: 'Tối đa 300 ký tự' } })}
          error={!!errors.title}
          helperText={errors.title?.message}
        />
        <TextField
          label="Mô tả"
          multiline
          rows={4}
          fullWidth
          {...register('description')}
        />
        <FormControl fullWidth>
          <InputLabel id="listing-category">Danh mục</InputLabel>
          <Select
            labelId="listing-category"
            label="Danh mục"
            {...register('categoryId')}
            defaultValue=""
          >
            <MenuItem value="">— Không chọn —</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id ?? c.categoryId} value={c.id ?? c.categoryId}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Checkbox {...register('isGiveaway')} />}
          label="Cho tặng (miễn phí)"
        />
        <TextField
          label="Giá (VNĐ)"
          type="number"
          fullWidth
          inputProps={{ min: 0, step: 1000 }}
          disabled={isGiveaway}
          {...register('price', { valueAsNumber: true, min: 0 })}
        />
        <FormControl fullWidth>
          <InputLabel id="listing-condition">Tình trạng</InputLabel>
          <Select
            labelId="listing-condition"
            label="Tình trạng"
            {...register('condition')}
          >
            {CONDITION_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="listing-purpose">Mục đích</InputLabel>
          <Select
            labelId="listing-purpose"
            label="Mục đích"
            {...register('purpose')}
          >
            {PURPOSE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <ImageUploader onFilesChange={setImageFiles} />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
        >
          {submitting ? 'Đang tạo...' : mode === 'create' ? 'Đăng tin' : 'Cập nhật'}
        </Button>
      </Stack>
    </Box>
  );
}
