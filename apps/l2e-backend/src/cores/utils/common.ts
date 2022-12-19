// import { Request } from 'express';

interface IUserAgentAndIpAddress {
  device: string;
  ip: string;
}

export const getDeviceAndIpInformation = (
  req
): IUserAgentAndIpAddress => {
  const device = req.headers['user-agent'];
  const ip =
    req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress;
  return { device, ip };
};
