import React from 'react';
import {
  Box,
  Button,
  Card,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';

// Color tokens matching SLIFE Dark theme
const CARD_BG = '#201D26';
const BORDER = 'rgba(255, 255, 255, 0.07)';
const TEXT_PRI = 'rgba(255, 255, 255, 0.95)';
const TEXT_SEC = 'rgba(255, 255, 255, 0.55)';
const PURPLE = '#9D6EED';

// Styled TextField for the dark theme
const StyledTextField = ({ label, ...props }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="body2" sx={{ color: TEXT_SEC, mb: 1, fontWeight: 600 }}>
      {label}
    </Typography>
    <TextField
      fullWidth
      variant="outlined"
      {...props}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 2,
          color: TEXT_PRI,
          '& fieldset': { borderColor: BORDER },
          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
          '&.Mui-focused fieldset': { borderColor: PURPLE },
        },
        '& .MuiFormHelperText-root': { color: '#ff4d4d' },
        ...props.sx
      }}
    />
  </Box>
);

export default function EditProfileForm({ formData, handleChange, errors, handleSave, handleCancel }) {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 3, sm: 5 },
        borderRadius: 6,
        bgcolor: CARD_BG,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
      }}
    >
      <Grid container spacing={4}>
        {/* Left Column: Basic Info */}
        <Grid item xs={12} md={6}>
          <StyledTextField
            label="Tên hiển thị *"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={!!errors.fullName}
            helperText={errors.fullName}
            placeholder="Nhập tên của bạn"
          />
          
          <StyledTextField
            label="Số điện thoại"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Nhập số điện thoại"
          />

          <StyledTextField
            label="Ngày sinh"
            name="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Right Column: Bio & Address */}
        <Grid item xs={12} md={6}>
          <StyledTextField
            label="Địa chỉ"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Nhập địa chỉ của bạn"
          />

          <StyledTextField
            label="Giới thiệu bản thân"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            multiline
            rows={5}
            placeholder="Chia sẻ một chút về bản thân bạn..."
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4, borderColor: BORDER }} />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          onClick={handleCancel}
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: 2.5,
            textTransform: 'none',
            fontWeight: 700,
            color: TEXT_SEC,
            border: `1px solid ${BORDER}`,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)', borderColor: TEXT_SEC }
          }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: 2.5,
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: PURPLE,
            color: 'white',
            boxShadow: `0 8px 20px rgba(157, 110, 237, 0.25)`,
            '&:hover': { bgcolor: '#835cd4', boxShadow: `0 10px 25px rgba(157, 110, 237, 0.35)` }
          }}
        >
          Lưu thay đổi
        </Button>
      </Box>
    </Card>
  );
}
