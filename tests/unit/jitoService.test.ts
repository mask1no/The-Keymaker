import { getJitoApiUrl } from '@/lib/server/jitoService'; describe('jitoService', () => { it('getJitoApiUrl returns correct base', () => { expect(getJitoApiUrl('ffm')).toContain('/api/v1/bundles'); });
});
