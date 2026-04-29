import CommunityPostListPage from '../../components/community/CommunityPostListPage';

export default function CommunityLikedPage() {
    return (
        <CommunityPostListPage
            mode="liked"
            title="Bài viết đã thích"
            emptyTitle="Bài viết bạn đã thích sẽ hiển thị ở đây."
            emptySubtitle="Hãy thích những bài viết bạn muốn quay lại sau."
            requireAuth
        />
    );
}
