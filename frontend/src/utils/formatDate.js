/** Mục đích: helper format ngày giờ cho listing/deal/notification. */
import { format } from 'date-fns';
export const formatDate = (value, fmt = 'dd/MM/yyyy HH:mm') => value ? format(new Date(value), fmt) : '';
