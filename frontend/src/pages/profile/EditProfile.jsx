import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Breadcrumbs,
  Link,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// Components
"use client";
import EditProfileForm from '../../components/profile/EditProfileForm';

// Color tokens matching SLIFE Dark theme
const PAGE_BG = '#1C1B23';
const TEXT_PRI = 'rgba(255, 255, 255, 0.95)';
const TEXT_SEC = 'rgba(255, 255, 255, 0.55)';
const PURPLE = '#9D6EED';

export default function EditProfile() {
  const navigate = useNavigate();
  
  // Local state for form fields
  const [formData, setFormData] = useState({
    fullName: 'Đặng Quang Huy',
    bio: 'Sinh viên FPT, thích mua bán đồ cũ công nghệ.',
    phoneNumber: '0987654321',
    address: 'Sơn Tây, Hà Nội',
    birthDate: '2000-01-01'
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSave = () => {
    if (!formData.fullName.trim()) {
      setErrors({ fullName: 'Tên hiển thị không được để trống' });
      return;
    }
    console.log('Saving profile data:', formData);
    alert('Đã lưu thay đổi (Xem console.log để biết chi tiết)');
    navigate(-1);
  };

  const handleCancel = () => navigate(-1);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: PAGE_BG, py: 4 }}>
      <Container maxWidth="md">
        {/* Navigation / Breadcrumbs */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 16, color: TEXT_SEC }} />} sx={{ mb: 2 }}>
            <Link
              onClick={() => navigate('/')}
              sx={{
                display: 'flex', alignItems: 'center', color: TEXT_SEC,
                textDecoration: 'none', fontSize: 13, cursor: 'pointer',
                '&:hover': { color: TEXT_PRI }
              }}
            >
              <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
              SLIFE
            </Link>
            <Link
              onClick={() => navigate('/profile/me')}
              sx={{ color: TEXT_SEC, textDecoration: 'none', fontSize: 13, cursor: 'pointer', '&:hover': { color: TEXT_PRI } }}
            >
              Trang cá nhân
            </Link>
            <Typography color={TEXT_PRI} fontSize={13} fontWeight={500}>Chỉnh sửa hồ sơ</Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleCancel} sx={{ color: TEXT_PRI }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight={800} color={TEXT_PRI}>Chỉnh sửa hồ sơ</Typography>
          </Box>
        </Box>

        {/* Main Form Component */}
        <EditProfileForm 
          formData={formData} 
          handleChange={handleChange} 
          errors={errors} 
          handleSave={handleSave} 
          handleCancel={handleCancel} 
        />

        {/* Note Section */}
        <Paper
          elevation={0}
          sx={{
            mt: 4, p: 3, borderRadius: 4,
            bgcolor: 'rgba(157, 110, 237, 0.05)',
            border: `1px solid rgba(157, 110, 237, 0.1)`,
          }}
        >
          <Typography variant="body2" color={PURPLE} fontWeight={600}>Lưu ý:</Typography>
          <Typography variant="caption" color={TEXT_SEC} sx={{ display: 'block', mt: 0.5 }}>
            Thông tin của bạn sẽ được hiển thị công khai trên trang cá nhân để người mua có thể tin tưởng và liên hệ dễ dàng hơn.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
