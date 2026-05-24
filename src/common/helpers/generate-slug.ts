import slugify from 'slugify';
import { nanoid } from 'nanoid';

export const generateSlug = (str: string): string => {
  const slug = slugify(str, {
    lower: true,
    strict: true,
    locale: 'vi',
  });
  return `${slug}-${nanoid(5)}`;
};
