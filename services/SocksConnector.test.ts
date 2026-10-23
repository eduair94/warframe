import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SocksClient } from 'socks';
import { createSocksConnector } from './SocksConnector';

jest.mock('socks', () => ({ SocksClient: { createConnection: jest.fn() } }));
const connectMock = jest.mocked(SocksClient.createConnection);

describe('SOCKS connector for fixed WFM egress', () => {
  beforeEach(() => connectMock.mockReset());

  it('connects to the configured tunnel and forwards the destination hostname', async () => {
    const socket = {};
    connectMock.mockResolvedValue({ socket } as any);
    const connect = createSocksConnector('socks5://sync:p%40ss@127.0.0.1:27028');
    const result = await new Promise((resolve, reject) => {
      connect({ hostname: 'api.warframe.market', protocol: 'http:', port: '80' }, (error, connection) => {
        if (error) reject(error);
        else resolve(connection);
      });
    });

    expect(result).toBe(socket);
    expect(connectMock).toHaveBeenCalledWith({
      proxy: { host: '127.0.0.1', port: 27028, type: 5, userId: 'sync', password: 'p@ss' },
      command: 'connect',
      destination: { host: 'api.warframe.market', port: 80 },
      timeout: 15000,
    });
  });

  it('reports a failed tunnel without a direct connection fallback', async () => {
    connectMock.mockRejectedValue(new Error('Tunnel unavailable'));
    const connect = createSocksConnector('socks5://127.0.0.1:27028');
    await expect(new Promise((resolve, reject) => {
      connect({ hostname: 'api.warframe.market', protocol: 'https:', port: '443' }, (error, socket) => {
        if (error) reject(error);
        else resolve(socket);
      });
    })).rejects.toThrow('Tunnel unavailable');
    expect(connectMock).toHaveBeenCalledTimes(1);
  });
});
