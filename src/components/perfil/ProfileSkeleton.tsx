import { FC } from 'react';

export const ProfileSkeleton: FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gray-200" />
        <div className="space-y-3">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-8 w-32 bg-gray-200 rounded mt-2" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4 border-b border-gray-200">
        <div className="h-10 w-24 bg-gray-200 rounded-t" />
        <div className="h-10 w-24 bg-gray-200 rounded-t" />
        <div className="h-10 w-32 bg-gray-200 rounded-t" />
        <div className="h-10 w-32 bg-gray-200 rounded-t" />
      </div>

      {/* Form Details Skeleton */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-24 w-full bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
};
