/**
 * Mục đích: Form reusable cho tạo/cập nhật listing.
 * API: POST /api/listings, PUT /api/listings/{id}, POST /api/listings/{id}/images.
 * Validation: react-hook-form; title 10-120 ký tự, description 20-2000, price >=0.
 */
import {Box, Button, TextField, Typography, Grid, MenuItem, Checkbox, FormControlLabel, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, List, ListItemButton, ListItemText, IconButton, InputAdornment} from "@mui/material";
import { useForm } from 'react-hook-form';
import { useState } from "react";
import ImageUploader from '../common/ImageUploader';
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import LaptopMacOutlined from "@mui/icons-material/LaptopMacOutlined";
import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import UmbrellaOutlined from "@mui/icons-material/UmbrellaOutlined";
import SportsBasketballOutlined from "@mui/icons-material/SportsBasketballOutlined";
import MusicNoteOutlined from "@mui/icons-material/MusicNoteOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Radio from "@mui/material/Radio";

export default function ListingForm({ defaultValues = {}, onSubmit }) {
  const { register, handleSubmit } = useForm({ defaultValues });

    const [category, setCategory] = useState("");
    const [openCategory, setOpenCategory] = useState(false);
    const [condition, setCondition] = useState("used");
    const [price, setPrice] = useState("");
    const [isGiveaway, setIsGiveaway] = useState(false);
    const [openSubCategory, setOpenSubCategory] = useState(false);
    const [selectedSub, setSelectedSub] = useState("");

    const categories = [
        { name: "Dụng cụ & tài liệu học tập", icon: <MenuBookOutlined /> },
        { name: "Thiết bị điện tử", icon: <LaptopMacOutlined /> },
        { name: "Quần áo & phụ kiện", icon: <CheckroomOutlined /> },
        { name: "Đồ dùng cá nhân & phòng trọ", icon: <UmbrellaOutlined />, hasChild: true },
        { name: "Phương tiện & thể thao", icon: <SportsBasketballOutlined /> },
        { name: "Giải trí & sở thích", icon: <MusicNoteOutlined /> },
        { name: "Sản phẩm khác", icon: <Inventory2Outlined /> }
    ];

    const roomSubCategories = [
        "Bàn ghế, tủ, kệ",
        "Thiết bị vệ sinh, nhà tắm",
        "Bếp lò, đồ điện nhà bếp",
        "Giường, chăn ga gối đệm",
        "Quạt, đèn",
        "Đồ trang trí",
        "Đồ dùng cá nhân, phòng trọ khác"
    ];

    const submitForm = (values) => {onSubmit?.({...values, category, condition});
    };

    const formatPrice = (value) => {
        if (!value) return "";
        return Number(value).toLocaleString("vi-VN");
    };

  return (
      <Box
          component="form"
          onSubmit={handleSubmit(submitForm)}
          sx={{
              maxWidth: "1200px",
              width: "90%",
              mx: "auto",
              mt: 6,
              mb: 8,
              p: 6,
              border: "3px solid #201D26",
              borderRadius: "14px",
              backgroundColor: "#FFFFFF"
          }}
      >

          {/* IMAGE */}

          <Typography fontWeight={600} fontSize={20} mb={1.5}>
              Hình ảnh (Tối đa 6 ảnh) <Box component="span" sx={{ color: 'error.main' }}>*</Box>
          </Typography>

          <Box mb={3}>
              <ImageUploader />
          </Box>



          {/* DESCRIPTION */}

          <Typography fontWeight={600} fontSize={20} mb={1.5}>
              Mô tả bài đăng <Box component="span" sx={{ color: 'error.main' }}>*</Box>
          </Typography>

          <TextField
              fullWidth
              multiline
              rows={5}
              placeholder="Mô tả chi tiết sản phẩm..."
              {...register("description", {
                  required: true,
                  minLength: 20,
                  maxLength: 2000
              })}
              sx={{
                  "& .MuiInputBase-input": {
                      fontSize: "20px"
                  }
              }}
          />



          {/* TITLE + CATEGORY */}

          <Grid container spacing={3} mt={1}>

              <Grid item xs={12} md={6}>
                  <Typography fontWeight={600} fontSize={20} mb={1.5}>
                      Tiêu đề bài đăng <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </Typography>

                  <TextField
                      fullWidth
                      placeholder="Nhập tiêu đề..."
                      {...register("title", {
                          required: true,
                          minLength: 10,
                          maxLength: 120
                      })}
                      sx={{
                          "& .MuiInputBase-input": {
                              fontSize: "20px"
                          }
                      }}
                  />
              </Grid>


              {/* CATEGORY POPUP */}

              <Grid item xs={12} md={6}>
                  <Typography fontWeight={600} fontSize={20} mb={1.5}>
                      Danh mục <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </Typography>

                  <Box
                      onClick={() => {
                          if (selectedSub) {
                              setOpenSubCategory(true);   // đã chọn danh mục con → mở dialog con
                          } else {
                              setOpenCategory(true);      // chưa chọn → mở dialog cha
                          }
                      }}
                      sx={{
                          border: "1px solid #ccc",
                          borderRadius: "10px",
                          px: 2,
                          py: 1.5,
                          cursor: "pointer",
                          background: "#fff",
                          fontSize: "20px",  // tăng size chữ
                          "&:hover": {
                              borderColor: "#201D26"
                          }
                      }}
                  >
                      {selectedSub || category || "Chọn danh mục"}
                  </Box>

              </Grid>

          </Grid>



          {/* PRICE + LOCATION */}

          <Grid container spacing={3} mt={1}>

              <Grid item xs={12} md={6}>

                  <Typography fontWeight={600} fontSize={20} mb={1.5}>
                      Giá bán <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </Typography>

                  <TextField
                      fullWidth
                      value={isGiveaway ? "0" : formatPrice(price)}
                      disabled={isGiveaway}
                      onChange={(e) => {const raw = e.target.value.replace(/\D/g, ""); // chỉ giữ số
                          if (!isGiveaway) {
                              setPrice(raw);
                          }
                      }}

                      inputProps={{
                          inputMode: "numeric",
                          pattern: "[0-9]*",
                          min: 0
                      }}

                      InputProps={{endAdornment: <InputAdornment position="end"><Box sx={{ fontSize: 20, fontWeight: 700, ml: 0.5 }}>đ</Box></InputAdornment>}}
                      sx={{
                          "& .MuiInputBase-input": {
                              fontSize: "20px"
                          }
                      }}
                  />

                  <FormControlLabel
                      control={
                          <Checkbox
                              checked={isGiveaway}
                              onChange={(e) => {
                                  const checked = e.target.checked;
                                  setIsGiveaway(checked);
                                  if (checked) {
                                      setPrice("0");
                                  } else {
                                      setPrice("");
                                  }
                              }}
                          />
                      }
                      label="Tôi muốn trao tặng miễn phí"
                      sx={{
                          "& .MuiFormControlLabel-label": {
                              fontSize: "18px",
                              fontWeight: 500
                          }
                      }}
                  />

              </Grid>



              {/* LOCATION */}

              <Grid item xs={12} md={6}>

                  <Typography fontWeight={600} fontSize={20} mb={1.5}>
                      Địa chỉ <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </Typography>

                  <TextField
                      select
                      fullWidth
                      defaultValue="tanxa"
                      {...register("location")}
                      sx={{
                          "& .MuiInputBase-input": {
                              fontSize: "20px"
                          }
                      }}
                  >
                      <MenuItem value="tanxa" sx={{ fontSize: "20px" }}>Tân Xã</MenuItem>
                      <MenuItem value="thachhoa" sx={{ fontSize: "20px" }}>Thạch Hòa</MenuItem>
                      <MenuItem value="binhyen" sx={{ fontSize: "20px" }}>Bình Yên</MenuItem>
                  </TextField>

                  <Typography fontSize={16} mt={1} color="error">
                      Chỉ hỗ trợ giao dịch trong khu vực Hoà Lạc
                  </Typography>

              </Grid>

          </Grid>



          <Grid container spacing={3} mt={2} alignItems="center">

              {/* CONDITION */}
              <Grid item xs={12} md={6}>
                  <Typography fontWeight={600} fontSize={20} mb={1.5}>
                      Tình trạng <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </Typography>

                  <ToggleButtonGroup
                      exclusive
                      value={condition}
                      onChange={(e, value) => value && setCondition(value)}
                  >
                      <ToggleButton
                          value="used"
                          sx={{
                              px: 4,
                              py: 1.2,
                              borderRadius: "12px",
                              backgroundColor: "#E0E0E0",
                              color: "#201D26",
                              border: "none",

                              "&.Mui-selected": {
                                  backgroundColor: "#9D6EED",
                                  color: "#fff",
                                  "&:hover": {
                                      backgroundColor: "#B794F6" // tím nhạt hơn
                                  }
                              }
                          }}
                      >
                          ĐÃ SỬ DỤNG
                      </ToggleButton>

                      <ToggleButton
                          value="new"
                          sx={{
                              px: 4,
                              py: 1.2,
                              borderRadius: "12px",
                              backgroundColor: "#E0E0E0",
                              color: "#201D26",
                              border: "none",

                              "&.Mui-selected": {
                                  backgroundColor: "#9D6EED",
                                  color: "#fff",
                                  "&:hover": {
                                      backgroundColor: "#B794F6" // tím nhạt hơn
                                  }
                              }
                          }}
                      >
                          MỚI
                      </ToggleButton>
                  </ToggleButtonGroup>
              </Grid>

              {/* BUTTONS */}
              <Grid item xs={12} md={6}>
                  <Box display="flex" gap={2}>
                      <Button
                          variant="outlined"
                          fullWidth
                          sx={{
                              borderColor: "#201D26",
                              color: "#201D26",
                              py: 1.6,
                              fontSize: "18px",
                              fontWeight: 600,
                              borderRadius: "12px",
                              border: "3px solid"
                          }}
                      >
                          LƯU NHÁP
                      </Button>

                      <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          sx={{
                              backgroundColor: "#201D26",
                              py: 1.6,
                              fontSize: "18px",
                              fontWeight: 600,
                              borderRadius: "12px"
                          }}
                      >
                          ĐĂNG TIN
                      </Button>
                  </Box>
              </Grid>

          </Grid>


          {/* CATEGORY POPUP */}

          <Dialog
              open={openCategory}
              onClose={() => setOpenCategory(false)}
              maxWidth="xs"
              fullWidth
          >

              <DialogTitle
                  sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#201D26",
                      color: "#fff"
                  }}
              >
                  Chọn danh mục

                  <IconButton
                      onClick={() => setOpenCategory(false)}
                      sx={{ color: "#fff" }}
                  >
                      <CloseIcon />
                  </IconButton>

              </DialogTitle>


              <List sx={{ background: "#201D26", color: "#fff" }}>

                  {categories.map((item) => (

                      <ListItemButton
                          key={item.name}
                          onClick={() => {

                              if (item.hasChild) {
                                  setOpenCategory(false);
                                  setOpenSubCategory(true);
                              } else {
                                  setCategory(item.name);
                                  setOpenCategory(false);
                              }

                          }}
                          sx={{
                              borderBottom: "1px solid rgba(255,255,255,0.1)",
                              py: 2,
                              display: "flex",
                              alignItems: "center",
                              gap: 2
                          }}
                      >

                          {/* icon */}
                          <Box sx={{ color: "#9D6EED" }}>
                              {item.icon}
                          </Box>

                          <ListItemText primary={item.name} />

                          {/* arrow */}
                          <ChevronRightIcon />

                      </ListItemButton>

                  ))}

              </List>

          </Dialog>

          <Dialog
              open={openSubCategory}
              onClose={() => setOpenSubCategory(false)}
              maxWidth="xs"
              fullWidth
          >

              <DialogTitle
                  sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      background: "#201D26",
                      color: "#fff"
                  }}
              >

                  <IconButton
                      onClick={() => {
                          setOpenSubCategory(false);
                          setOpenCategory(true);
                      }}
                      sx={{ color: "#fff" }}
                  >
                      <ArrowBackIcon />
                  </IconButton>

                  Chọn danh mục

              </DialogTitle>


              <List sx={{ background: "#201D26", color: "#fff" }}>

                  {roomSubCategories.map((item) => (

                      <ListItemButton
                          key={item}
                          onClick={() => {
                              setSelectedSub(item);
                              setCategory(item);
                              setOpenSubCategory(false);
                          }}
                          sx={{
                              borderBottom: "1px solid rgba(255,255,255,0.1)"
                          }}
                      >

                          <ListItemText primary={item} />

                          <Radio
                              checked={selectedSub === item}
                              sx={{
                                  color: "#9D6EED",
                                  "&.Mui-checked": {
                                      color: "#9D6EED"
                                  }
                              }}
                          />

                      </ListItemButton>

                  ))}

              </List>

          </Dialog>
      </Box>
  );
}
