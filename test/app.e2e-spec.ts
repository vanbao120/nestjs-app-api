import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
const PORT = 3002;
describe('App EndToEnd test', () => {
  let app: INestApplication, primaService: PrismaService;
  beforeAll(async () => {
    const appModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = appModule.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    app.listen(PORT);
    primaService = app.get(PrismaService);
    await primaService.cleanDatabase();
    pactum.request.setBaseUrl(`http://localhost:${PORT}`);
  });
  describe('Test Authentication', () => {
    describe('Register', () => {
      it('should register', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody({
            email: 'test@example.com',
            password: '1234',
          })
          .expectStatus(201);
      });
    });
    describe('Login', () => {
      it('should login', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({
            email: 'test@example.com',
            password: '1234',
          })
          .expectStatus(201);
      });
    });
  });
  afterAll(async () => {
    app.close();
  });
  it.todo('Should pass');
});
