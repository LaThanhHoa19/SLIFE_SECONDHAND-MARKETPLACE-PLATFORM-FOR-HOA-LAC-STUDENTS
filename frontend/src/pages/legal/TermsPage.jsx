import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    ButtonBase,
    Container,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useMemo, useState } from 'react';

export default function TermsPage() {
    const accentColor = '#A78BFA';

    const sections = useMemo(
        () => [
            {
                key: 'general',
                number: 1,
                label: 'Quy định chung',
                title: 'Quy định chung',
                items: [
                    {
                        title: 'Giới thiệu về SLife',
                        body:
                            'SLife là nền tảng chợ trực tuyến dành riêng cho việc mua bán và trao đổi đồ cũ giữa sinh viên tại khu vực Hòa Lạc.\n\n' +
                            '- Mục tiêu: Giúp việc mua, bán, tặng đồ đã qua sử dụng trở nên thuận tiện và minh bạch. SLife chuẩn hóa thông tin sản phẩm và tăng tương tác thông qua các tính năng như đăng tin, tìm kiếm, trò chuyện, thương lượng giá và xác nhận giao dịch.\n' +
                            '- Mô hình hoạt động: SLife đóng vai trò nền tảng kết nối. Người mua và người bán tự thỏa thuận điều kiện giao dịch; SLife không trực tiếp quản lý dòng tiền hay vận chuyển.\n' +
                            '- Giá trị cốt lõi: Ưu tiên xác minh người dùng, chuẩn hóa yêu cầu đăng tin và cơ chế báo cáo vi phạm nhằm xây dựng niềm tin, đồng thời giảm thiểu rủi ro giao dịch trong cộng đồng sinh viên.',
                    },
                    {
                        title: 'Quy chế hoạt động website',
                        body:
                            'Nội dung dưới đây mô tả phạm vi cung cấp dịch vụ và cách thức vận hành nền tảng SLife.\n\n' +
                            '- Phạm vi dịch vụ: Hệ thống hỗ trợ các hoạt động mua bán và tặng đồ phù hợp với nhu cầu học tập và sinh hoạt của sinh viên.\n' +
                            '- Cơ chế giao dịch: Các giao dịch được hình thành dựa trên sự thỏa thuận tự nguyện giữa người dùng. Hệ thống không hỗ trợ thanh toán trực tuyến hoặc dịch vụ vận chuyển tận nơi.\n' +
                            '- Cơ chế kiểm soát nội dung: SLife áp dụng phương thức hậu kiểm. Quản trị viên sẽ can thiệp khi nhận được báo cáo từ người dùng hoặc phát hiện các vi phạm quy định của nền tảng.\n' +
                            '- Quyền truy cập:\n' +
                            '  - Khách: Chỉ có quyền xem các tin đăng công khai và hồ sơ người bán.\n' +
                            '  - Người dùng đã xác thực: Có đầy đủ quyền tương tác như đăng tin, nhắn tin, bình luận và đánh giá.',
                    },
                    {
                        title: 'Chính sách bảo mật của SLife',
                        body:
                            'Chính sách này mô tả cách SLife xác thực người dùng, bảo vệ dữ liệu nhạy cảm, kiểm soát hiển thị thông tin và giám sát vận hành để đảm bảo quyền riêng tư trong cộng đồng.\n\n' +
                            '- Xác thực và bảo mật danh tính\n' +
                            '  - Sử dụng Google SSO: Hệ thống tích hợp xác thực qua Google, yêu cầu người dùng sử dụng email giáo dục (đuôi @fpt.edu.vn) để đảm bảo chỉ sinh viên trong cộng đồng mới có quyền truy cập và tương tác trên nền tảng.\n' +
                            '  - Xác minh sinh viên: Quy trình xác thực giúp hệ thống nhận diện đúng vai trò và đảm bảo tính chính danh của người dùng trước khi họ có thể thực hiện các hành động tương tác.\n' +
                            '  - Xác minh số điện thoại: Như đã bổ sung trong quy chế tài khoản, việc xác thực số điện thoại giúp tăng độ tin cậy nhưng vẫn đảm bảo tính duy nhất cho mỗi tài khoản.\n\n' +
                            '- Bảo vệ dữ liệu nhạy cảm\n' +
                            '  - Cơ chế che dấu thông tin: Với các thông tin cực kỳ nhạy cảm như số Căn cước công dân (CCCD/CMND) và Ngày sinh, hệ thống sẽ che thông tin để đảm bảo quyền riêng tư ngay cả khi người dùng cập nhật hồ sơ.\n' +
                            '  - Quản lý phiên đăng nhập: Các hành động yêu cầu quyền riêng tư phải được thực hiện trong phiên đăng nhập hợp lệ và sẽ tự động hết hạn sau một khoảng thời gian để hạn chế truy cập trái phép.\n\n' +
                            '- Phân quyền và hiển thị thông tin\n' +
                            '  - Hồ sơ công khai vs. riêng tư:\n' +
                            '    - Trang cá nhân công khai: Chỉ hiển thị các thông tin cơ bản như tên, đánh giá, tỷ lệ giao dịch thành công và các bài đăng để người khác tham khảo.\n' +
                            '    - Trang cá nhân riêng tư: Chỉ chủ tài khoản mới có quyền xem và quản lý các thông tin chi tiết, cài đặt tài khoản và lịch sử giao dịch đầy đủ.\n' +
                            '  - Kiểm soát liên lạc: Người dùng có quyền Chặn người dùng khác để ngăn chặn việc gửi tin nhắn hoặc xem các bài đăng của nhau, giúp bảo vệ khỏi sự quấy rối.\n\n' +
                            '- Lưu trữ và giám sát\n' +
                            '  - Lưu trữ cơ sở dữ liệu: Dữ liệu gồm thông tin người dùng, tin nhắn chat, danh sách yêu thích và báo cáo vi phạm được lưu trữ và quản lý chặt chẽ trong hệ thống cơ sở dữ liệu.\n' +
                            '  - Nhật ký quản trị: Mọi hành động của quản trị viên đối với tài khoản hoặc bài đăng của người dùng đều được ghi lại để phục vụ kiểm toán và đảm bảo tính minh bạch, trách nhiệm.\n' +
                            '  - Xử lý vi phạm: Hệ thống có cơ chế tự động đánh giá các báo cáo và có thể tự động khóa tài khoản nếu vi phạm vượt quá ngưỡng cho phép nhằm bảo vệ cộng đồng chung.',
                    },
                    {
                        title: 'Cơ chế giải quyết tranh chấp của SLife',
                        body:
                            'Cơ chế này hướng dẫn cách ghi nhận thỏa thuận, gửi báo cáo khi có sai lệch và quy trình xử lý tranh chấp trên SLife.\n\n' +
                            '- Ghi nhận lịch sử thỏa thuận\n' +
                            '  - Trước khi xác nhận giao dịch, cả người mua và người bán đều có quyền xem chi tiết thỏa thuận, bao gồm thông tin sản phẩm, giá cả đã chốt và thông tin các bên tham gia.\n' +
                            '  - Khi một trong hai bên chọn xác nhận giao dịch, thỏa thuận này sẽ được hệ thống ghi nhận chính thức.\n\n' +
                            '- Quy trình báo cáo khi có sai lệch\n' +
                            '  - Trong trường hợp hàng hóa nhận được thực tế khác biệt so với nội dung trong lịch sử thỏa thuận, người dùng có quyền gửi báo cáo người dùng.\n' +
                            '  - Bằng chứng: Người dùng nên cung cấp hình ảnh thực tế của sản phẩm nhận được để làm căn cứ cho Admin xem xét.\n' +
                            '- Vai trò và các biện pháp xử lý của Quản trị viên\n' +
                            '  - Xem xét báo cáo: Quản trị viên truy cập danh sách các báo cáo đang chờ xử lý để kiểm tra chi tiết lỗi và bằng chứng hình ảnh do người dùng cung cấp.\n' +
                            '  - Các hình thức kỷ luật (tùy mức độ vi phạm):\n' +
                            '    - Cảnh báo: Nhắc nhở người dùng về quy định cộng đồng.\n' +
                            '    - Cắm cờ: Đánh dấu vi phạm vào hồ sơ người dùng. Theo quy định, nếu một tài khoản nhận đủ 3 lần cắm cờ, hệ thống sẽ tự động ban (khóa) tài khoản đó.\n' +
                            '    - Hạn chế tài khoản: Người dùng bị hạn chế sẽ không thể đăng tin, gửi tin nhắn, bình luận hoặc gửi báo cáo mới.\n' +
                            '    - Ban (Khóa vĩnh viễn): Tài khoản bị ban sẽ không thể đăng nhập hoặc thực hiện bất kỳ hành động nào trên hệ thống.\n\n' +
                            '- Hệ thống đánh giá bổ sung\n' +
                            '  - Bên cạnh việc báo cáo, người mua có thể để lại đánh giá người bán từ 1 đến 5 sao sau khi giao dịch kết thúc để giúp cộng đồng nhận diện các tài khoản uy tín hoặc có vấn đề.',
                    },
                    {
                        title: 'Quy chế tài khoản',
                        body:
                            'Quy chế này quy định về việc đăng ký/đăng nhập, xác thực và trách nhiệm khi sử dụng tài khoản SLife.\n\n' +
                            '- Đăng ký và xác thực: Người dùng đăng nhập qua Google SSO; ưu tiên sử dụng email giáo dục (ví dụ: @fpt.edu.vn) để xác thực danh tính sinh viên.\n' +
                            '- Xác minh số điện thoại (mục bổ sung):\n' +
                            '  - Yêu cầu xác minh: Người dùng có thể cung cấp và xác thực số điện thoại trong phần Cập nhật hồ sơ để tăng độ tin cậy khi liên lạc.\n' +
                            '  - Hiển thị trạng thái: Sau khi xác minh thành công, hồ sơ công khai sẽ hiển thị trạng thái “Số điện thoại đã xác thực”.\n' +
                            '  - Tính duy nhất: Mỗi số điện thoại chỉ được đăng ký cho một tài khoản; hệ thống sẽ báo lỗi nếu số đã tồn tại.\n' +
                            '  - Định dạng hợp lệ: Số điện thoại phải đúng định dạng quy định; hệ thống sẽ từ chối và hiển thị thông báo lỗi nếu không hợp lệ.\n' +
                            '- Trách nhiệm và bảo mật: Người dùng tự quản lý thông tin cá nhân, đảm bảo tính chính xác của dữ liệu và chịu trách nhiệm về nội dung/hoạt động phát sinh từ tài khoản.\n' +
                            '- Cơ chế kiểm soát và kỷ luật:\n' +
                            '  - Hệ thống báo cáo: Người dùng có thể báo cáo các tài khoản có hành vi vi phạm hoặc cung cấp thông tin giả mạo.\n' +
                            '  - Tự động khóa tài khoản: Tài khoản có thể bị tự động khóa nếu vi phạm quá số lần quy định (ví dụ: bị báo cáo vi phạm 3 lần).\n' +
                            '  - Hạn chế quyền: Tài khoản bị khóa hoặc bị hạn chế sẽ không thể thực hiện các tương tác như đăng tin, nhắn tin, bình luận hoặc gửi báo cáo.',
                    },
                ],
            },
            {
                key: 'posting',
                number: 2,
                label: 'Quy định đăng tin',
                title: 'Quy định đăng tin',
                items: [
                    {
                        title: 'Quy định đăng tin trên SLife',
                        body:
                            'Quy định này áp dụng cho việc tạo và đăng tải tin trên SLife.\n\n' +
                            '- Quy định về tin đăng\n' +
                            '  - Chỉ dành cho hàng hóa: SLife không chấp nhận tin đăng về dịch vụ (ví dụ sửa máy tính, gia sư, làm hộ bài tập). Hệ thống chỉ dành cho mua bán hoặc tặng đồ vật lý.\n' +
                            '  - Không đăng tin rác (spam): nghiêm cấm bài đăng không nhằm trao đổi đồ cũ như thông báo họp, lời chúc, thư từ hoặc quảng cáo không liên quan.\n' +
                            '  - Thông tin chuẩn hóa: mỗi tin phải có tên sản phẩm, giá bán (hoặc giá 0 khi tặng) và ít nhất 3 ảnh thực tế của món đồ.\n\n' +
                            '- Cơ chế kiểm soát và chế tài\n' +
                            '  - Hệ thống báo cáo: người dùng có quyền báo cáo tin đăng vi phạm danh mục hàng cấm.\n' +
                            '  - Quyền quản trị: quản trị viên có quyền ẩn ngay các bài đăng vi phạm chính sách hàng hóa mà không cần báo trước.\n' +
                            '  - Tự động khóa tài khoản: nếu người dùng đăng hàng cấm và bị cắm cờ quá 3 lần, hệ thống có thể tự động khóa tài khoản vĩnh viễn.\n' +
                            '  - Lịch sử thỏa thuận: nếu hàng thực tế không đúng mô tả hoặc thuộc danh mục cấm nhưng người bán vẫn đăng, người mua có quyền cung cấp ảnh bằng chứng để quản trị viên xem xét, xử lý hậu kiểm.',
                    },
                    {
                        title: 'Quy định về hàng hóa trên SLife',
                        body:
                            'Các hàng hóa đăng tải trên SLife phải tuân thủ pháp luật Việt Nam và quy định cụ thể của cộng đồng sinh viên khu vực Hòa Lạc nhằm đảm bảo an toàn và minh bạch.\n\n' +
                            '- Hàng hóa bị cấm theo pháp luật Việt Nam\n' +
                            '  - Hàng hóa bất hợp pháp:\n' +
                            '    - Chất kích thích: ma túy, thuốc gây nghiện, gây ảo giác, các dạng tương tự.\n' +
                            '    - Vũ khí và công cụ hỗ trợ: súng, lựu đạn, mìn, dao găm, kiếm, mã tấu, quả đấm, gậy baton, bình xịt hơi cay, đèn pin tự vệ có khả năng gây sát thương.\n' +
                            '    - Vật dụng quân sự: quân trang, quân hiệu, phù hiệu, thiết bị quân sự chuyên dụng.\n' +
                            '    - Nội dung phản động: sách báo, tài liệu chống phá Nhà nước, kích động bạo loạn hoặc bạo lực.\n' +
                            '    - Bộ phận cơ thể: nội tạng hoặc bất kỳ bộ phận cơ thể người nào.\n' +
                            '  - Hàng hóa nguy hiểm và đồi trụy:\n' +
                            '    - Pháo hoa, thuốc nổ và hóa chất độc hại (axit, chất phóng xạ, thuốc diệt côn trùng độc hại).\n' +
                            '    - Sản phẩm khiêu dâm, nội dung người lớn hoặc hình ảnh nhạy cảm không phù hợp chuẩn mực sinh viên.\n' +
                            '  - Hàng hóa không rõ nguồn gốc và vi phạm bản quyền:\n' +
                            '    - Phương tiện: xe không giấy tờ, xe biển xanh hoặc biển đỏ; mua bán riêng lẻ biển số, giấy tờ xe hoặc số khung, số máy.\n' +
                            '    - Hàng giả, hàng nhái: sản phẩm nhái thương hiệu, hàng nhập lậu hoặc vi phạm quyền sở hữu trí tuệ (sách điện tử, phần mềm lậu, bản ghi trái phép).\n' +
                            '    - Động thực vật hoang dã: loài quý hiếm, vật sống hoặc bộ phận động vật hoang dã (ngà, nanh, sừng), công cụ săn bắt, bẫy thú.\n\n' +
                            '- Hàng hóa bị cấm theo quy định của SLife (nhóm nhạy cảm, sức khỏe)\n' +
                            '  - Vì SLife hướng tới môi trường sinh viên an toàn, các nhóm hàng sau không được đăng tải:\n' +
                            '  - Sản phẩm y tế:\n' +
                            '    - Thuốc các loại (kê đơn, thực phẩm chức năng, thảo dược, y học cổ truyền).\n' +
                            '    - Thiết bị y tế cần chỉ định bác sĩ (máy đo SpO2, máy trợ thính, kính cận, kính áp tròng).\n' +
                            '  - Mặt hàng ảnh hưởng vệ sinh và sức khỏe:\n' +
                            '    - Quần áo lót đã qua sử dụng.\n' +
                            '    - Mỹ phẩm dạng uống hoặc tiêm (chỉ chấp nhận mỹ phẩm dùng ngoài da còn mới).\n' +
                            '    - Rượu, bia, thuốc lá và thuốc lá điện tử.\n' +
                            '  - Vật phẩm mê tín và cờ bạc: bùa hộ mạng, vật phẩm thần bí hoặc sản phẩm phục vụ cờ bạc (máy đánh bài, máy chơi game quy đổi tiền mặt).\n' +
                            '  - Di tích lịch sử: hiện vật, di vật thuộc công trình văn hóa, bảo vật quốc gia.\n\n' +
                            '',
                    },
                ],
            },
            {
                key: 'features',
                number: 3,
                label: 'Quy định về tính năng và dịch vụ',
                title: 'Quy định về tính năng và dịch vụ',
                items: [
                    {
                        title: 'Quy tắc giao dịch và ứng xử',
                        body: 'Người dùng cần tôn trọng lẫn nhau, giao tiếp văn minh, không quấy rối hoặc đe doạ. Khi giao dịch, hai bên tự thỏa thuận phương thức thanh toán/nhận hàng và chủ động kiểm tra sản phẩm.',
                    },
                ],
            },
        ],
        []
    );

    const [activeKey, setActiveKey] = useState(sections[0].key);
    const activeSection = sections.find((s) => s.key === activeKey) ?? sections[0];
    const [activeItemByKey, setActiveItemByKey] = useState(() =>
        Object.fromEntries(sections.map((s) => [s.key, s.items?.[0]?.title ?? '']))
    );
    const activeItemTitle = activeItemByKey[activeSection.key] ?? '';
    const activeItem = activeSection.items.find((i) => i.title === activeItemTitle) ?? activeSection.items[0] ?? null;

    const renderBody = (body) => {
        const blocks = String(body ?? '')
            .split('\n\n')
            .map((b) => b.trim())
            .filter(Boolean);

        let topIndex = 0;
        return (
            <Stack spacing={1.75}>
                {blocks.map((block, idx) => {
                    const rawLines = block
                        .split('\n')
                        .map((l) => l.replace(/\t/g, '    '))
                        .filter((l) => l.trim().length > 0);

                    const bulletLines = rawLines
                        .map((l) => {
                            const m = l.match(/^(\s*)(- |\* |• )(.+)$/);
                            if (!m) return null;
                            const indent = m[1]?.length ?? 0;
                            const level = Math.min(3, Math.floor(indent / 2)); // 0,1,2,3
                            return { level, text: m[3].trim() };
                        })
                        .filter(Boolean);

                    const isBulletBlock = bulletLines.length > 0 && bulletLines.length === rawLines.length;

                    if (isBulletBlock) {
                        return (
                            <Box
                                key={`b-${idx}`}
                                sx={{
                                    borderLeft: '2px solid rgba(255,255,255,0.2)',
                                    pl: 2,
                                }}
                            >
                                <Stack spacing={1.25}>
                                    {bulletLines.map((b) => {
                                        const isTop = b.level === 0;
                                        if (isTop) topIndex += 1;
                                        const prefix = isTop ? `${topIndex}.` : b.level >= 2 ? '–' : '•';

                                        return (
                                            <Typography
                                                key={`${b.level}-${b.text}`}
                                                sx={{
                                                    color: 'rgba(255,255,255,0.78)',
                                                    lineHeight: 1.9,
                                                    pl: b.level ? b.level * 2 : 0,
                                                }}
                                            >
                                                {prefix} {b.text}
                                            </Typography>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        );
                    }

                    const paragraphText = rawLines.map((l) => l.trim()).join(' ');
                    return (
                        <Typography
                            key={`p-${idx}`}
                            sx={{
                                color: 'rgba(255,255,255,0.78)',
                                lineHeight: 1.9,
                            }}
                        >
                            {paragraphText}
                        </Typography>
                    );
                })}
            </Stack>
        );
    };

    return (
        <Box
            sx={{
                py: { xs: 4, md: 6 },
                background: 'linear-gradient(180deg, rgba(23,21,34,0.35) 0%, rgba(20,18,37,0.65) 100%)',
            }}
        >
            <Container maxWidth="lg">
                <Stack spacing={2.25}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 0.75 }}>
                            Quy chế hoạt động
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                            Trang này mô tả các nguyên tắc và quy định khi sử dụng nền tảng SLIFE. Nội dung có thể được cập nhật định
                            kỳ để phù hợp với vận hành thực tế và quy định liên quan.
                        </Typography>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '320px 1fr' },
                            gap: 2.25,
                            alignItems: 'start',
                        }}
                    >
                        <Box
                            sx={{
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 2,
                                background: 'rgba(255,255,255,0.02)',
                                overflow: 'hidden',
                                position: { md: 'sticky' },
                                top: { md: 88 },
                            }}
                        >
                            {sections.map((s, idx) => {
                                const isExpanded = activeKey === s.key;
                                const hasSubItems = (s.items?.length ?? 0) > 1;

                                return (
                                    <Accordion
                                        key={s.key}
                                        expanded={isExpanded}
                                        disableGutters
                                        elevation={0}
                                        square={idx !== 0}
                                        onChange={(_, nextExpanded) => {
                                            setActiveKey(nextExpanded ? s.key : s.key);
                                            if (s.items?.[0]?.title) {
                                                setActiveItemByKey((prev) => ({
                                                    ...prev,
                                                    [s.key]: prev?.[s.key] || s.items[0].title,
                                                }));
                                            }
                                        }}
                                        sx={{
                                            background: 'transparent',
                                            color: '#FFFFFF',
                                            '&:before': { display: 'none' },
                                            borderBottom: idx < sections.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(255,255,255,0.75)' }} />}
                                            sx={{
                                                px: 2,
                                                py: 0.75,
                                                '& .MuiAccordionSummary-content': { my: 1.1 },
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontWeight: 800,
                                                    color: isExpanded ? accentColor : 'rgba(255,255,255,0.75)',
                                                }}
                                            >
                                                {s.label}
                                            </Typography>
                                        </AccordionSummary>

                                        <AccordionDetails sx={{ px: 1.25, pb: 1.25, pt: 0 }}>
                                            {hasSubItems ? (
                                                <Stack spacing={0.5} sx={{ pl: 1 }}>
                                                    {s.items.map((it) => {
                                                        const selected = activeKey === s.key && (activeItemByKey[s.key] ?? '') === it.title;
                                                        return (
                                                            <ButtonBase
                                                                key={it.title}
                                                                onClick={() => {
                                                                    setActiveKey(s.key);
                                                                    setActiveItemByKey((prev) => ({ ...prev, [s.key]: it.title }));
                                                                }}
                                                                sx={{
                                                                    width: '100%',
                                                                    justifyContent: 'flex-start',
                                                                    textAlign: 'left',
                                                                    borderRadius: 1,
                                                                    px: 1,
                                                                    py: 0.75,
                                                                    color: selected ? accentColor : 'rgba(255,255,255,0.68)',
                                                                    fontWeight: 650,
                                                                    transition: 'background 0.15s, color 0.15s',
                                                                    '&:hover': { background: 'rgba(167,139,250,0.08)' },
                                                                }}
                                                            >
                                                                <Typography sx={{ fontSize: '0.95rem' }}>{it.title}</Typography>
                                                            </ButtonBase>
                                                        );
                                                    })}
                                                </Stack>
                                            ) : (
                                                <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', pl: 1 }}>
                                                    Nhấn để xem nội dung bên phải.
                                                </Typography>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                );
                            })}
                        </Box>

                        <Box
                            sx={{
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 2,
                                background: 'rgba(255,255,255,0.02)',
                                p: { xs: 2, md: 2.5 },
                            }}
                        >
                            <Typography variant="h5" sx={{ fontWeight: 850, color: '#FFFFFF', mb: 1.25 }}>
                                {activeSection.key === 'general'
                                    ? activeItem?.title ?? activeSection.title
                                    : activeSection.title}
                            </Typography>
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

                            <Stack spacing={2}>
                                {(activeSection.items?.length ?? 0) > 1 ? (
                                    renderBody(activeItem?.body ?? '')
                                ) : (
                                    activeSection.items.map((item) => (
                                        <Box key={item.title}>
                                            <Typography sx={{ fontWeight: 800, color: '#FFFFFF', mb: 0.75 }}>{item.title}</Typography>
                                            {renderBody(item.body)}
                                        </Box>
                                    ))
                                )}
                            </Stack>
                        </Box>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}

