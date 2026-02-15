
import { useState } from "react";
import { CreatePost } from "@/components/feed/CreatePost";
import { FeedList } from "@/components/feed/FeedList";

const Feed = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handlePostCreated = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <div className="container mx-auto py-6 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Feed</h1>
            <CreatePost onPostCreated={handlePostCreated} />
            <FeedList refreshTrigger={refreshTrigger} />
        </div>
    );
};

export default Feed;
