import { Button } from "~/features/shared/components/ui/button";

type LoginButtonPresenterProps = {
  readonly loginUrl: string;
};

export function LoginButtonPresenter({ loginUrl }: LoginButtonPresenterProps) {
  return (
    <a href={loginUrl}>
      <Button variant="discord" size="sm">
        ログイン
      </Button>
    </a>
  );
}
