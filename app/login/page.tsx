import LoginForm from "@/components/LoginForm";

// 环境变量在服务端读取,避免将“允许注册”的判断只留在前端。
export const dynamic = "force-dynamic";

/** 登录页:用户名 + 密码;注册入口由环境变量控制。 */
export default function LoginPage() {
  const registrationEnabled = process.env.ALLOW_REGISTRATION === "true";

  return <LoginForm registrationEnabled={registrationEnabled} />;
}
