import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private cache = new Map<string, string>();

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    try {
      const { data } = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: { lat, lon: lng, format: 'json', zoom: 14 },
        headers: { 'User-Agent': 'FreightTrack/1.0' },
        timeout: 3000,
      });
      const addr = data.address || {};
      const parts = [addr.suburb || addr.village || addr.town || addr.city_district, addr.city || addr.state_district, addr.state].filter(Boolean);
      const result = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || `${lat}, ${lng}`;
      this.cache.set(key, result);
      if (this.cache.size > 5000) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      return result;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
}
