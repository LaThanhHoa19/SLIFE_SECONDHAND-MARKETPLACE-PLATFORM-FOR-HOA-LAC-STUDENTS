export const MOCK_REVIEWS = [
  {
    id: 1,
    reviewer: 'Nguyễn Văn An',
    rating: 5,
    time: '2 ngày trước',
    content: 'Người bán rất nhiệt tình, máy dùng tốt đúng như mô tả. Giao hàng nhanh và đóng gói cênt thận.',
    tags: ['Giao tiếp lịch sự', 'Đúng hẹn'],
    product: 'iPhone 13 Pro Max 256GB'
  },
  {
    id: 2,
    reviewer: 'Trần Thị Bích',
    rating: 4,
    time: '1 tuần trước',
    content: 'Giá hợp lý, tuy nhiên phản hồi hơi chậm một chút nhưng vẫn rất hài lòng.',
    tags: ['Giá hợp lý', 'Mô tả đúng'],
    product: 'Tủ lạnh Samsung 200L'
  },
  {
    id: 3,
    reviewer: 'Lê Minh Tâm',
    rating: 5,
    time: '2 tuần trước',
    content: 'Đúng hẹn, làm việc chuyên nghiệp. Sẽ ủng hộ tiếp.',
    tags: ['Đúng hẹn', 'Phản hồi nhanh'],
  },
  {
    id: 4,
    reviewer: 'Phạm Đức Mạnh',
    rating: 5,
    time: '1 tháng trước',
    content: 'Sản phẩm tuyệt vời, cảm ơn shop!',
    tags: ['Giao tiếp lịch sự'],
  },
  {
    id: 5,
    reviewer: 'Vũ Thu Hà',
    rating: 4,
    time: '1 tháng trước',
    content: 'Mọi thứ đều ổn, gói sản phẩm rất chắc chắn.',
    tags: ['Mô tả đúng'],
  },
  {
    id: 6,
    reviewer: 'Hoàng Anh Tuấn',
    rating: 5,
    time: '2 tháng trước',
    content: 'Uy tín, 10 điểm!',
    tags: ['Giá hợp lý', 'Phản hồi nhanh'],
  }
];

export const MOCK_SELLING = [
  { id: 101, title: 'Laptop Dell XPS 13 9310', price: 18500000, category: 'Đồ điện tử', createdAt: '2024-03-10', imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400', location: 'Thạch Thất, Hà Nội' },
  { id: 102, title: 'Tai nghe Sony WH-1000XM4', price: 4200000, category: 'Phụ kiện', createdAt: '2024-03-12', imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426da473b?w=400', location: 'Hòa Lạc, Hà Nội' },
  { id: 103, title: 'Bàn phím cơ Keychron K2', price: 1200000, category: 'Phụ kiện', createdAt: '2024-03-14', imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400', location: 'Thạch Thất, Hà Nội' },
  { id: 104, title: 'Chuột Logitech G Pro X Superlight', price: 2100000, category: 'Phụ kiện', createdAt: '2024-03-15', imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', location: 'Bình Yên, Hà Nội' },
  { id: 105, title: 'Màn hình Dell UltraSharp U2419H', price: 3500000, category: 'Đồ điện tử', createdAt: '2024-03-16', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400', location: 'Hòa Lạc, Hà Nội' },
  { id: 106, title: 'Loa Marshall Emberton', price: 2800000, category: 'Âm thanh', createdAt: '2024-03-17', imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400', location: 'Thạch Thất, Hà Nội' },
];

export const MOCK_SOLD = [
  { id: 201, title: 'iPhone 12 64GB VN/A', price: 7500000, category: 'Điện thoại', createdAt: '2024-01-05', imageUrl: 'https://images.unsplash.com/photo-1611791485932-50e8999a527c?w=400', location: 'Hòa Lạc, Hà Nội' },
  { id: 202, title: 'iPad Air 4 64GB Wifi', price: 8900000, category: 'Máy tính bảng', createdAt: '2024-02-10', imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', location: 'Thạch Thất, Hà Nội' },
];

export const mockSeller = (id) => ({
  id: id,
  fullName: 'Hoàng Anh Tài',
  avatarUrl: 'https://i.pravatar.cc/150?u=1',
  coverImageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200',
  reputationScore: 4.8,
  createdAt: '2022-05-15T00:00:00Z',
  responseRate: '98%',
  followers: '1.2k',
  address: 'Hầu Lâu, Thạch Thất, Hà Nội',
  bio: 'Chuyên cung cấp đồ công nghệ cũ và mới tại khu vực Hòa Lạc. Cam kết bảo hành chu đáo, giao dịch nhanh gọn.',
  isOnline: true
});
