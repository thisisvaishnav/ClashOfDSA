import { db } from '../../core/database/db.client';

export type UserSearchResult = {
  id: string;
  name: string;
  image: string | null;
  rating: number;
};

export const searchUsers = async (
  query: string,
  currentUserId: string,
  limit: number = 10,
): Promise<UserSearchResult[]> => {
  const users = await db.user.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
      id: { not: currentUserId },
    },
    select: { id: true, name: true, image: true, rating: true },
    take: limit,
    orderBy: { name: 'asc' },
  });

  return users;
};
