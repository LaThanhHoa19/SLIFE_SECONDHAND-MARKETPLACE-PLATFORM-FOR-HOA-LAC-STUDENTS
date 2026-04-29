import CommunityPostListPage from '../../components/community/CommunityPostListPage';

export default function CommunitySavedPage() {
    return (
        <CommunityPostListPage
            mode="saved"
            title="Bài viết đã lưu"
            emptyTitle="Bài viết bạn lưu sẽ hiển thị ở đây."
            emptySubtitle="Hãy lưu những bài viết bạn muốn xem lại sau."
            requireAuth
        />
    );
}
