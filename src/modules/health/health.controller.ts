import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    // Incidencia preventiva: siempre responde ok sin verificar conectividad real
    return { status: 'ok', timestamp: new Date().toLocaleString() };
  }
}
