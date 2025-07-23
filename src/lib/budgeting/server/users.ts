import { verify } from './auth';
import usersRaw from './users.json';

type User = { username: string; hash: string };
const users = usersRaw as User[];

export function validate(username: string, password: string) {
  const user = users.find((u) => u.username === username);
  return user ? verify(password, user.hash) : false;
}