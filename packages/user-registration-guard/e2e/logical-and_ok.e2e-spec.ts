import { createTestEnvironment } from "@vendure/testing";
import path from "path";
import { afterAll, beforeAll, describe, test } from "vitest";
import { initialData } from "../../../utils/e2e/e2e-initial-data";
import { testConfig } from "../../../utils/e2e/test-config";
import { UserRegistrationGuardPlugin } from "../src/user-registration-guard.plugin";
import { alwaysTrue } from "./fixtures/assertions";
import { CREATE_ADMIN } from "./graphql/admin-e2e-definitions";
import { REGISTER_CUSTOMER } from "./graphql/shop-e2e-definitions";
import { CreateMutation, CreateMutationVariables } from "./types/generated-admin-types";
import { RegisterMutation, RegisterMutationVariables } from "./types/generated-shop-types";

describe("Logical AND", { concurrent: true }, async () => {
  const { server, adminClient, shopClient } = createTestEnvironment({
    ...testConfig(8004),
    plugins: [
      UserRegistrationGuardPlugin.init({
        shop: {
          assert: {
            logicalOperator: "AND",
            functions: [alwaysTrue, alwaysTrue],
          },
        },
        admin: {
          assert: {
            logicalOperator: "AND",
            functions: [alwaysTrue, alwaysTrue],
          },
        },
      }),
    ],
  });

  beforeAll(async () => {
    await server.init({
      productsCsvPath: path.join(__dirname, "../../../utils/e2e/e2e-products-full.csv"),
      initialData: initialData,
      customerCount: 2,
    });
    await adminClient.asSuperAdmin();
  }, 60000);

  afterAll(async () => {
    await server.destroy();
  });

  test("Success for logical AND where the assertions are: [true, true] for customers", async ({ expect }) => {
    const res = await shopClient.query<RegisterMutation, RegisterMutationVariables>(REGISTER_CUSTOMER, {
      input: { emailAddress: "example@example.com" },
    });

    expect(res.registerCustomerAccount.__typename).toStrictEqual("Success");
  });

  test("Success for logical AND where the assertions are: [true, true] for admins", async ({ expect }) => {
    const res = await adminClient.query<CreateMutation, CreateMutationVariables>(CREATE_ADMIN, {
      input: {
        emailAddress: "example@example.com",
        firstName: "",
        lastName: "",
        password: "",
        roleIds: [],
      },
    });

    expect(res.createAdministrator.__typename).toStrictEqual("Administrator");
  });
});
