import { z } from '../test.deps.ts';

Deno.test('Zod Bench', async (t) => {
  await t.step('Dynamic Action', () => {
    function test(hello: string, world: string): void {
      console.log(hello);
      console.log(world);
    }

    const actionSchema = z.custom<typeof test>();

    type actionInputs = Parameters<typeof test>;

    // const func = z.ZodFunction.create(
    //   z.tuple(z.custom<actionInputs>() as ZodTypeAny, z.string()),
    //   z.custom<ReturnType<typeof test>>()
    // );

    type actionType = z.infer<typeof actionSchema>;

    const action: actionType = actionSchema.parse(test);

    console.log(actionSchema);

    action('Mike', 'G');
  });
});
