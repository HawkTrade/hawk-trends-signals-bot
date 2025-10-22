type TwitterApiResponse = {
  status: "success" | "error";
  msg: string;
};

type FilterRuleCreateResponse = TwitterApiResponse & {
  rule_id: string;
};

type FilterRuleUpdateRequest = {
  rule_id: string;
  tag: string;
  value: string;
  interval_seconds: number;
  is_effect?: 0 | 1;
};

type FilterRule = Omit<FilterRuleUpdateRequest, "is_effect">;
type FilterRules = TwitterApiResponse & {
  rules: FilterRule[];
};

type HawkApiResponse<T = string[]> = Partial<{
  data: T;
  msg: string;
  error: string;
}>;

export type {
  FilterRuleCreateResponse,
  FilterRuleUpdateRequest,
  TwitterApiResponse,
  FilterRules,
  HawkApiResponse,
};
