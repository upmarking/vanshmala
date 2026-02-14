
import { useParams } from 'react-router-dom';
import { TagManager } from '@/components/tags/TagManager';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const TagManagerWrapper = () => {
    const { treeId } = useParams<{ treeId: string }>();
    if (!treeId) return <div>Tree ID not found</div>;
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="flex-1 container mx-auto px-4 py-8">
                <TagManager treeId={treeId} />
            </div>
            <Footer />
        </div>
    );
};
