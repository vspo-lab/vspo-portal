import { Form } from "react-router";
import { AvatarFallback } from "~/features/shared/components/ui/avatar-fallback";
import { Button } from "~/features/shared/components/ui/button";

type UserMenuPresenterProps = {
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly logoutAction: string;
};

export function UserMenuPresenter({
  displayName,
  avatarUrl,
  logoutAction,
}: UserMenuPresenterProps) {
  return (
    <div className="flex items-center gap-3">
      <AvatarFallback src={avatarUrl} name={displayName} size="sm" />
      <span className="text-sm font-medium">{displayName}</span>
      <Form method="post" action={logoutAction}>
        <Button variant="ghost" size="sm" type="submit">
          ログアウト
        </Button>
      </Form>
    </div>
  );
}
